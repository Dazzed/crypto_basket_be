#!/bin/bash
set -ex

SERVICE=$1
ENVIRONMENT=$2
PROJECT_PATH=$3
SERVICE_PATH=$4
DOCKERFILE_PATH=$5

GIT_COMMIT_SHA=$(git rev-parse HEAD)
DEPLOY_SCRIPT_TIMESTAMP=$(date +"%s")
TAG=$GIT_COMMIT_SHA.$DEPLOY_SCRIPT_TIMESTAMP
ENVIRONMENT_NAME=melotic-$ENVIRONMENT
SERVICE_ROOT=$PROJECT_PATH/$SERVICE_PATH
DOCKERFILE=$SERVICE_ROOT/$DOCKERFILE_PATH
SERVICE_NAME=melotic-$SERVICE
SERVICE_TAG=$SERVICE_NAME:$TAG
SERVICE_URL=569325332953.dkr.ecr.us-east-1.amazonaws.com/$SERVICE_TAG
SECRET_NAME=melotic-$SERVICE-secrets
CONFIGMAP_NAME=melotic-$SERVICE-configmap
DEPLOY_PATH=$PROJECT_PATH/deploy

eval $(aws ecr get-login --no-include-email --region us-east-1 --profile gigster-network)
docker build -f $DOCKERFILE -t $SERVICE_TAG $SERVICE_ROOT --build-arg NODE_ENV=$ENVIRONMENT
docker tag $SERVICE_TAG $SERVICE_URL
docker push $SERVICE_URL

# create the configmap
kubectl delete configmap $CONFIGMAP_NAME -n=$ENVIRONMENT_NAME || echo \
  "Failed to delete deployment configmap. OK for first time deployment."
touch $DEPLOY_PATH/$ENVIRONMENT_NAME/.config
kubectl create configmap $CONFIGMAP_NAME --from-env-file=$DEPLOY_PATH/$ENVIRONMENT_NAME/.config -n=$ENVIRONMENT_NAME

# create the secrets
kubectl delete secret $SECRET_NAME -n=$ENVIRONMENT_NAME || echo \
  "Failed to delete deployment secrets. OK for first time deployment."
touch $DEPLOY_PATH/$ENVIRONMENT_NAME/.env
kubectl create secret generic $SECRET_NAME --from-env-file=$DEPLOY_PATH/$ENVIRONMENT_NAME/.env -n=$ENVIRONMENT_NAME

# push to prod

cp $DEPLOY_PATH/$SERVICE_NAME-deployment.yaml $DEPLOY_PATH/$SERVICE_NAME-deployment-tmp.yaml
sed -i.bak "s/__TAG__/$TAG/" $DEPLOY_PATH/$SERVICE_NAME-deployment-tmp.yaml
rm $DEPLOY_PATH/$SERVICE_NAME-deployment-tmp.yaml.bak

kubectl apply -f $DEPLOY_PATH/$ENVIRONMENT_NAME/$SERVICE_NAME-service.yaml -n=$ENVIRONMENT_NAME
kubectl apply -f $DEPLOY_PATH/$SERVICE_NAME-deployment-tmp.yaml -n=$ENVIRONMENT_NAME

rm $DEPLOY_PATH/$SERVICE_NAME-deployment-tmp.yaml

echo "All Done! Visit https://$SERVICE_NAME-$2.aws.gigsternetwork.com to see your deployment live."
