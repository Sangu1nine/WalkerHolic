from langchain.tools import BaseTool
from typing import Dict, List, Any, Optional, Type
import numpy as np
from dtw import dtw
from database.supabase_client import supabase_client
import logging
from langsmith import traceable

logger = logging.getLogger(__name__)

class GaitAnalysisTool(BaseTool):
    name: str = "gait_analysis"
    description: str = "보행 데이터를 분석하여 패턴을 식별하고 건강 상태를 평가합니다."
    
    @traceable(name="gait_analysis_tool")
    def _run(self, embedding_data: List[float], user_id: str) -> Dict[str, Any]:
        """보행 데이터 분석 실행"""
        try:
            # 1. RAG 데이터 조회
            rag_data = self._get_rag_data()
            
            # 2. 사용자 건강정보 조회
            user_health = self._get_user_health_info(user_id)
            
            # 3. DTW를 사용한 유사도 계산
            similarity_results = self._calculate_similarity(embedding_data, rag_data)
            
            # 4. 분석 결과 생성
            analysis_result = self._generate_analysis(
                similarity_results, 
                user_health, 
                embedding_data
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"보행 분석 실패: {e}")
            return {"error": str(e)}
    
    @traceable(name="get_rag_data")
    def _get_rag_data(self) -> List[Dict]:
        """RAG 데이터 조회"""
        # 예시 RAG 데이터 (실제로는 Supabase에서 조회)
        return [
            {
                "pattern_name": "정상보행",
                "embedding": [0.1, 0.2, 0.3, 0.4, 0.5],
                "description": "균형잡힌 정상적인 보행 패턴",
                "characteristics": ["일정한 보폭", "안정적인 리듬", "균형잡힌 자세"]
            },
            {
                "pattern_name": "불안정보행",
                "embedding": [0.8, 0.7, 0.6, 0.9, 0.8],
                "description": "균형이 불안정한 보행 패턴",
                "characteristics": ["불규칙한 보폭", "흔들리는 움직임", "균형 문제"]
            }
        ]
    
    @traceable(name="get_user_health_info")
    def _get_user_health_info(self, user_id: str) -> Dict:
        """사용자 건강정보 조회"""
        # 예시 건강정보 (실제로는 Supabase에서 조회)
        return {
            "age": 65,
            "gender": "male",
            "diseases": ["고혈압", "당뇨병"],
            "height": 170,
            "weight": 70,
            "medications": ["혈압약", "당뇨약"]
        }
    
    @traceable(name="calculate_similarity")
    def _calculate_similarity(self, user_embedding: List[float], rag_data: List[Dict]) -> List[Dict]:
        """DTW를 사용한 유사도 계산"""
        similarities = []
        
        for rag_item in rag_data:
            # DTW 거리 계산
            distance, _ = dtw(
                np.array(user_embedding).reshape(-1, 1),
                np.array(rag_item["embedding"]).reshape(-1, 1)
            )
            
            # 유사도로 변환 (거리가 작을수록 유사도 높음)
            similarity = 1 / (1 + distance)
            
            similarities.append({
                "pattern_name": rag_item["pattern_name"],
                "similarity": similarity,
                "description": rag_item["description"],
                "characteristics": rag_item["characteristics"]
            })
        
        # 유사도 순으로 정렬
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities
    
    @traceable(name="generate_analysis")
    def _generate_analysis(self, similarities: List[Dict], user_health: Dict, embedding_data: List[float]) -> Dict:
        """분석 결과 생성"""
        best_match = similarities[0]
        
        # 기본 분석 결과
        result = {
            "gait_pattern": best_match["pattern_name"],
            "similarity_score": best_match["similarity"],
            "pattern_description": best_match["description"],
            "characteristics": best_match["characteristics"],
            "health_assessment": self._assess_health_risk(best_match, user_health),
            "recommendations": self._generate_recommendations(best_match, user_health),
            "risk_factors": self._identify_risk_factors(best_match, user_health)
        }
        
        return result
    
    @traceable(name="assess_health_risk")
    def _assess_health_risk(self, pattern: Dict, health_info: Dict) -> str:
        """건강 위험도 평가"""
        if pattern["pattern_name"] == "정상보행":
            return "낮음"
        elif pattern["similarity"] < 0.3:
            return "높음"
        else:
            return "중간"
    
    @traceable(name="generate_recommendations")
    def _generate_recommendations(self, pattern: Dict, health_info: Dict) -> List[str]:
        """권장사항 생성"""
        recommendations = []
        
        if pattern["pattern_name"] == "불안정보행":
            recommendations.extend([
                "균형 운동을 꾸준히 실시하세요",
                "보행 보조기구 사용을 고려하세요",
                "의료진과 상담을 받으시기 바랍니다"
            ])
        
        if health_info.get("age", 0) > 65:
            recommendations.append("정기적인 건강검진을 받으세요")
        
        return recommendations
    
    @traceable(name="identify_risk_factors")
    def _identify_risk_factors(self, pattern: Dict, health_info: Dict) -> List[str]:
        """위험요인 식별"""
        risk_factors = []
        
        if pattern["similarity"] < 0.5:
            risk_factors.append("보행 패턴 이상")
        
        if health_info.get("age", 0) > 65:
            risk_factors.append("고령")
        
        if "당뇨병" in health_info.get("diseases", []):
            risk_factors.append("당뇨병으로 인한 신경계 영향")
        
        return risk_factors

gait_analysis_tool = GaitAnalysisTool()
