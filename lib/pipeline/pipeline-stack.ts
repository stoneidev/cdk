import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { ApplicationStage } from "./application-stage";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CodeCommit 리포지토리 생성
    const githubSource = pipelines.CodePipelineSource.gitHub(
      "lg-ensol/cdk", // GitHub 리포지토리 이름
      "main", // 브랜치 이름
      {
        authentication: cdk.SecretValue.secretsManager("sm-eu-aics-token"), // GitHub Personal Access Token
      }
    );
    // 파이프라인 생성
    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "Serverless-Pipeline",
      synth: new pipelines.ShellStep("Synth", {
        input: githubSource,        
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // 스테이징 환경에 AmplifyStack 배포
    const stagingStage = pipeline.addStage(
      new ApplicationStage(this, "ServerlessStack", {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );

    // 선택적: 프로덕션 환경에 AmplifyStack 배포
    // const prodStage = pipeline.addStage(new ApplicationStage(this, 'Production', {
    //   env: { account: 'PROD_ACCOUNT_ID', region: 'PROD_REGION' }
    // }));
  }
}
