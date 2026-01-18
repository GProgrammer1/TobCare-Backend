import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from 'path';

export class TobCareBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common bundling configuration for Prisma
    const prismaBundling: nodejs.BundlingOptions = {
      minify: true,
      sourceMap: false, // Disable source maps to reduce bundle size
      commandHooks: {
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [
            `cd ${inputDir}`,
            // Generate Prisma Client before bundling
            'npx prisma generate --schema=prisma/schema.prisma',
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
        'argon2',
        '@middy/core',
        '@middy/http-json-body-parser',
        '@middy/http-error-handler',
        'zod'
      ],
      externalModules: ['aws-sdk', '@aws-sdk/*'], // AWS SDK v3 is available in runtime
    };

    // Patient Registration Lambda
    const patientRegistrationFn = new nodejs.NodejsFunction(this, 'PatientRegistrationFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/patient-registration.ts'),
      handler: 'handler',
      bundling: prismaBundling,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || '',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
        // Prisma engine location (important for Lambda)
        PRISMA_ENGINES_MIRROR: 'https://binaries.prisma.sh',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512, // Argon2 needs more memory
    });

    // Hospitals Lambda
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
    patientResource.addMethod('OPTIONS', new apigw.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      requestTemplates: { 'application/json': '{"statusCode": 200}' }
    }), {
      methodResponses: [{ statusCode: '200' }]
    });

    // Hospitals endpoint
    const hospitalsResource = api.root.addResource('hospitals');
    hospitalsResource.addMethod('GET', new apigw.LambdaIntegration(hospitalsFn));
    hospitalsResource.addMethod('OPTIONS', new apigw.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      requestTemplates: { 'application/json': '{"statusCode": 200}' }
    }), {
      methodResponses: [{ statusCode: '200' }]
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
