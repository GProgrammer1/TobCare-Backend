import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from 'path';

export class TobCareBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prismaBundling: nodejs.BundlingOptions = {
      minify: true,
      sourceMap: false, 
      commandHooks: {
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [
            `cd ${inputDir} && npx prisma generate --schema=prisma/schema.prisma`,
          ];
        },
        beforeInstall(): string[] {
          return [];
        },
        afterBundling(): string[] {
          return [];
        },
      },
      nodeModules: [
        '@prisma/client',
        '@prisma/adapter-pg',
        'pg',
        'argon2'
      ],
      externalModules: ['aws-sdk', '@aws-sdk/*'], 
    };

    const patientRegistrationFn = new nodejs.NodejsFunction(this, 'PatientRegistrationFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/patient-registration.ts'),
      handler: 'handler',
      bundling: prismaBundling,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || '',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
        PRISMA_ENGINES_MIRROR: 'https://binaries.prisma.sh',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512, 
    });

    const hospitalsFn = new nodejs.NodejsFunction(this, 'HospitalsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/hospitals.ts'),
      handler: 'handler',
      bundling: prismaBundling,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const patientLoginFn = new nodejs.NodejsFunction(this, 'PatientLoginFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/patient-login.ts'),
      handler: 'handler',
      bundling: prismaBundling,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // API Gateway
    const api = new apigw.RestApi(this, 'TobCareApi', {
      restApiName: 'TobCare API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      }
    });

    // Patient registration endpoint
    const patientResource = api.root.addResource('patient_signup');
    patientResource.addMethod('POST', new apigw.LambdaIntegration(patientRegistrationFn));

    // Patient login endpoint
    const patientLoginResource = api.root.addResource('patient_login');
    patientLoginResource.addMethod('POST', new apigw.LambdaIntegration(patientLoginFn));

    // Hospitals endpoint
    const hospitalsResource = api.root.addResource('hospitals');
    hospitalsResource.addMethod('GET', new apigw.LambdaIntegration(hospitalsFn));

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
