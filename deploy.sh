#!/bin/bash

# CDK 스택 배포
cdk deploy

# 리포지토리 URL 가져오기
REPO_URL=$(aws codecommit get-repository --repository-name stonei-frontend --query 'repositoryMetadata.cloneUrlHttp' --output text)

cd ./src/frontend

# 리포지토리 클론
git init
# git remote add origin $REPO_URL
git remote add origin codecommit::ap-northeast-2://stonei-frontend

# 소스 코드 복사 (소스 코드가 있는 디렉토리에 따라 경로 조정 필요)
# cp -R ../your-source-code-directory/* .

# 변경사항 커밋 및 푸시
git add .
git commit -m "Initial commit"
git push origin main