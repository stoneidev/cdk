import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class LambdaConstruct extends Construct {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda 함수 생성
    const helloLambda = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "src", "lambda")
      ),
      handler: "hello.handler",
    });

    // API Gateway 생성
    const api = new apigateway.RestApi(this, "HelloApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    // Lambda 통합 생성
    const helloIntegration = new apigateway.LambdaIntegration(helloLambda, {
      proxy: true,
      allowTestInvoke: true,
    });

    // 리소스 및 메서드 추가
    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("GET", helloIntegration);

    // CORS 설정을 모든 메서드에 적용
    this.addCorsOptions(helloResource);

    this.apiUrl = api.url;

    // API Gateway URL을 CloudFormation 출력으로 내보내기
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: api.url,
      description: "API Gateway URL",
      exportName: "ApiGatewayUrl",
    });
  }

  private addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}"
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }]
    })
  }
}