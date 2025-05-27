from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class IMUData(BaseModel):
    timestamp: datetime
    acc_x: float
    acc_y: float
    acc_z: float
    gyr_x: float
    gyr_y: float
    gyr_z: float
    user_id: str

class EmbeddingData(BaseModel):
    user_id: str
    timestamp: datetime
    embedding_vector: List[float]
    original_data_id: str

class AnalysisResult(BaseModel):
    user_id: str
    analysis_timestamp: datetime
    gait_pattern: str
    similarity_score: float
    health_assessment: str
    recommendations: List[str]
    risk_factors: List[str]
    pattern_description: Optional[str] = None
    characteristics: Optional[List[str]] = None
    confidence_level: Optional[float] = None
    analysis_type: Optional[str] = 'gait_pattern'
    ai_model_version: Optional[str] = 'v1.0'

class UserHealthInfo(BaseModel):
    user_id: str
    age: int
    gender: str
    diseases: List[str]
    height: float
    weight: float
    medications: List[str]
    bmi: Optional[float] = None
    activity_level: Optional[str] = None
    medical_history: Optional[dict] = None
    emergency_contact: Optional[dict] = None

class ChatMessage(BaseModel):
    user_id: str
    message: str
    timestamp: Optional[datetime] = None
    is_user: Optional[bool] = None

class Notification(BaseModel):
    user_id: str
    notification_type: str
    title: str
    message: str
    is_read: Optional[bool] = False
    priority: Optional[str] = 'normal'
    created_at: Optional[datetime] = None

class UserFeedback(BaseModel):
    user_id: str
    analysis_id: Optional[str] = None
    feedback_type: str
    rating: int
    comment: Optional[str] = None

class DashboardData(BaseModel):
    user_id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    bmi: Optional[float] = None
    activity_level: Optional[str] = None
    total_analyses: int = 0
    avg_similarity_score: Optional[float] = None
    last_analysis: Optional[datetime] = None
    high_risk_count: int = 0
    unread_notifications: int = 0

class AnalysisSession(BaseModel):
    user_id: str
    session_start: datetime
    session_end: Optional[datetime] = None
    analysis_count: int = 0
    total_processing_time: Optional[float] = None
    session_status: str = 'active'

class ModelPerformanceLog(BaseModel):
    model_name: str
    model_version: str
    analysis_id: Optional[str] = None
    processing_time: Optional[float] = None
    accuracy_score: Optional[float] = None
    confidence_score: Optional[float] = None
    error_message: Optional[str] = None
