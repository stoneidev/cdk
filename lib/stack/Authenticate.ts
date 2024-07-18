import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface CustomUserPoolProps {
  userPoolName: string;
  selfSignUpEnabled?: boolean;
  signInAliases?: cognito.SignInAliases;
  standardAttributes?: cognito.StandardAttributes;
  customAttributes?: { [key: string]: cognito.ICustomAttribute };
  passwordPolicy?: cognito.PasswordPolicy;
  mfa?: cognito.Mfa;
  emailSettings?: cognito.UserPoolEmail;
}

export class CustomUserPool extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CustomUserPoolProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: props.userPoolName,
      selfSignUpEnabled: props.selfSignUpEnabled ?? true,
      signInAliases: props.signInAliases ?? { username: true, email: true },
      standardAttributes: props.standardAttributes ?? {
        email: { required: true, mutable: true },
      },
      customAttributes: props.customAttributes,
      passwordPolicy: props.passwordPolicy ?? {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: props.mfa ?? cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      email: props.emailSettings,
      autoVerify: { email: true },
    });

    // 클라이언트 추가
    this.userPoolClient = this.userPool.addClient("app-client", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: `${props.userPoolName}-domain`,
      },
    });

    new cdk.CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
