from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, vehicles, rides, requests, notifications, reports, admin

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(vehicles.router)
api_router.include_router(rides.router)
api_router.include_router(requests.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.reports_router)
api_router.include_router(reports.blocks_router)
api_router.include_router(admin.router)
