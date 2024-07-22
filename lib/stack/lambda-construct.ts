import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class LambdaConstruct extends Construct {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda 레이어 생성
    const lambdaLayer = new lambda.LayerVersion(this, "MyLayer", {
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "src", "layer", "layer.zip")
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer for my Lambda function",
    });

    // Lambda 함수 생성
    const helloLambda = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "src", "lambda")
      ),
      handler: "hello.handler",
      layers: [lambdaLayer],
    });

    helloLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
        ],
        resources: ["*"],
      })
    );

    // API Gateway 생성 및 CORS 설정
    const api = new apigateway.RestApi(this, "HelloApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowCredentials: true,
      },
    });

    // Lambda 통합 생성
    const helloIntegration = new apigateway.LambdaIntegration(helloLambda);

    // 리소스 및 메서드 추가
    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("GET", helloIntegration);

    this.apiUrl = api.url;

    // API Gateway URL을 CloudFormation 출력으로 내보내기
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: api.url,
      description: "API Gateway URL",
      exportName: "ApiGatewayUrl",
    });
  }
}
