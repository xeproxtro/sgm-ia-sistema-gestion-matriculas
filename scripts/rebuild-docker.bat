@echo off
REM Script para reconstruir la imagen Docker con los nuevos microservicios
REM Uso: scripts\rebuild-docker.bat

echo 🔄 Reconstruyendo imagen Docker con microservicios...
echo =================================================

REM Detener contenedores
echo 🛑 Deteniendo contenedores...
docker compose down

REM Reconstruir imagen sin caché
echo 🔨 Reconstruyendo imagen (sin caché)...
docker compose build --no-cache

REM Iniciar contenedores
echo 🚀 Iniciando contenedores...
docker compose up -d

REM Esperar a que estén listos
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 10 /nobreak

REM Verificar estado
echo 📊 Verificando estado...
docker compose ps

echo.
echo ✅ Reconstrucción completada!
echo.
echo 📝 Para ejecutar microservicios dentro del contenedor:
echo    docker compose exec app npm run microservice:notifications
echo    docker compose exec app npm run microservice:pdf-reports
echo    docker compose exec app npm run microservice:file-generation
echo.
echo 📝 Para ver logs:
echo    docker compose logs -f app

pause
