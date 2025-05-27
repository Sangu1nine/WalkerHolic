from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from app.api.routes import router
from config.settings import settings
import logging
import os
from fastapi import FastAPI, HTTPException

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# LangSmith 환경 설정
if settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = settings.LANGCHAIN_TRACING_V2
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
    logger.info(f"LangSmith 추적이 활성화되었습니다. 프로젝트: {settings.LANGCHAIN_PROJECT}")
else:
    logger.warning("LangSmith API 키가 설정되지 않았습니다. 추적이 비활성화됩니다.")

app = FastAPI(
    title="WALKERHOLIC API",
    description="LangServe 기반 보행 분석 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 오리진만 허용하도록 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(router)

# LangServe 라우트 추가 (향후 확장용)
# add_routes(app, some_chain, path="/chain")

@app.get("/")
async def root():
    return {"message": "WALKERHOLIC API 서버가 실행 중입니다"}

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "healthy"}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.LANGSERVE_HOST,
        port=settings.LANGSERVE_PORT,
        reload=True
    )
