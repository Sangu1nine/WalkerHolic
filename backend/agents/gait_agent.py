from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from typing import TypedDict, List, Dict, Any
from tools.gait_analysis import gait_analysis_tool
from config.settings import settings
import logging
from langsmith import traceable

logger = logging.getLogger(__name__)

class GaitAnalysisState(TypedDict):
    messages: List[BaseMessage]
    user_id: str
    embedding_data: List[float]
    analysis_result: Dict[str, Any]
    is_walking: bool

class GaitAnalysisAgent:
    def __init__(self):
        self.is_mock = False
        try:
            if not settings.OPENAI_API_KEY:
                logger.warning("OpenAI API 키가 설정되지 않았습니다. 목업 모드로 실행합니다.")
                self.is_mock = True
            else:
                self.llm = ChatOpenAI(
                    model="gpt-4o",
                    api_key=settings.OPENAI_API_KEY,
                    temperature=0.1
                )
        except Exception as e:
            logger.warning(f"OpenAI 클라이언트 초기화 실패: {e}. 목업 모드로 실행합니다.")
            self.is_mock = True
            
        self.graph = self._create_graph()
    
    def _create_graph(self) -> StateGraph:
        """LangGraph 워크플로우 생성"""
        workflow = StateGraph(GaitAnalysisState)
        
        # 노드 추가
        workflow.add_node("check_walking", self._check_walking_status)
        workflow.add_node("analyze_gait", self._analyze_gait_data)
        workflow.add_node("generate_report", self._generate_report)
        
        # 엣지 추가
        workflow.set_entry_point("check_walking")
        workflow.add_conditional_edges(
            "check_walking",
            self._should_analyze,
            {
                "analyze": "analyze_gait",
                "skip": "generate_report"
            }
        )
        workflow.add_edge("analyze_gait", "generate_report")
        workflow.add_edge("generate_report", END)
        
        return workflow.compile()
    
    @traceable(name="check_walking_status")
    def _check_walking_status(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """보행 중인지 확인"""
        # 실제로는 사용자 입력이나 센서 데이터로 판단
        # 여기서는 임베딩 데이터가 있으면 보행 중으로 가정
        state["is_walking"] = len(state.get("embedding_data", [])) > 0
        
        if state["is_walking"]:
            message = HumanMessage(content="보행이 감지되었습니다. 분석을 시작합니다.")
        else:
            message = HumanMessage(content="보행이 감지되지 않았습니다. 이전 분석 결과를 표시합니다.")
        
        state["messages"].append(message)
        return state
    
    @traceable(name="should_analyze")
    def _should_analyze(self, state: GaitAnalysisState) -> str:
        """분석 여부 결정"""
        return "analyze" if state["is_walking"] else "skip"
    
    @traceable(name="analyze_gait_data")
    def _analyze_gait_data(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """보행 데이터 분석"""
        try:
            if self.is_mock:
                logger.info("목업 모드: 보행 데이터 분석")
                analysis_result = {
                    "gait_pattern": "정상보행",
                    "similarity_score": 0.85,
                    "pattern_description": "균형잡힌 정상적인 보행 패턴",
                    "characteristics": ["일정한 보폭", "안정적인 리듬", "균형잡힌 자세"],
                    "health_assessment": "낮음",
                    "recommendations": ["꾸준한 운동을 하세요", "정기적인 건강검진을 받으세요"],
                    "risk_factors": ["이상 없음"]
                }
            else:
                analysis_result = gait_analysis_tool._run(
                    state["embedding_data"],
                    state["user_id"]
                )
                
            state["analysis_result"] = analysis_result
            message = AIMessage(content="보행 데이터 분석이 완료되었습니다.")
            state["messages"].append(message)
            
        except Exception as e:
            logger.error(f"보행 분석 중 오류: {e}")
            state["analysis_result"] = {"error": str(e)}
            message = AIMessage(content=f"분석 중 오류가 발생했습니다: {e}")
            state["messages"].append(message)
        
        return state
    
    @traceable(name="generate_report")
    def _generate_report(self, state: GaitAnalysisState) -> GaitAnalysisState:
        """분석 리포트 생성"""
        if state.get("analysis_result") and "error" not in state["analysis_result"]:
            report = self._format_analysis_report(state["analysis_result"])
        else:
            report = "이전 분석 결과를 조회합니다."
        
        message = AIMessage(content=report)
        state["messages"].append(message)
        return state
    
    @traceable(name="format_analysis_report")
    def _format_analysis_report(self, analysis: Dict[str, Any]) -> str:
        """분석 결과를 사용자 친화적인 리포트로 변환"""
        report = f"""
## 보행 분석 결과

**감지된 보행 패턴**: {analysis.get('gait_pattern', '알 수 없음')}
**유사도 점수**: {analysis.get('similarity_score', 0):.2f}

**패턴 설명**: {analysis.get('pattern_description', '')}

**주요 특징**:
{chr(10).join(f"- {char}" for char in analysis.get('characteristics', []))}

**건강 위험도**: {analysis.get('health_assessment', '알 수 없음')}

**권장사항**:
{chr(10).join(f"- {rec}" for rec in analysis.get('recommendations', []))}

**주의사항**:
{chr(10).join(f"- {risk}" for risk in analysis.get('risk_factors', []))}
        """
        return report.strip()
    
    @traceable(name="process_gait_data")
    async def process_gait_data(self, user_id: str, embedding_data: List[float] = None) -> Dict[str, Any]:
        """보행 데이터 처리"""
        initial_state = GaitAnalysisState(
            messages=[],
            user_id=user_id,
            embedding_data=embedding_data or [],
            analysis_result={},
            is_walking=False
        )
        
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "messages": final_state["messages"],
            "analysis_result": final_state["analysis_result"],
            "is_walking": final_state["is_walking"]
        }

gait_agent = GaitAnalysisAgent()
