use hello_world::greeter_client::GreeterClient;
use hyper_rustls::HttpsConnector;
use hyper_util::client::legacy::Client;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::rt::TokioExecutor;
use lambda_grpc_web::lambda_runtime::tower;
use tonic::body::Body;
use tonic::transport::Uri;
use tonic_web::{GrpcWebCall, GrpcWebClientLayer, GrpcWebClientService};
use hello_world::HelloRequest;
use crate::hello_world::HelloReply;

mod hello_world {
    tonic::include_proto!("helloworld");
}

fn make_greeter_client() -> Result<
    GreeterClient<
        GrpcWebClientService<Client<HttpsConnector<HttpConnector>, GrpcWebCall<Body>>>,
    >,
    Box<dyn std::error::Error>,
> {
    let connector = hyper_rustls::HttpsConnectorBuilder::new()
        .with_provider_and_platform_verifier(rustls::crypto::aws_lc_rs::default_provider())
        .expect("should configure crypto library")
        .https_or_http()
        .enable_http1()
        .build();

    let client = Client::builder(TokioExecutor::new()).build(connector);

    let svc = tower::ServiceBuilder::new()
        .layer(GrpcWebClientLayer::new())
        .service(client);

    let origin = Uri::from_static("http://127.0.0.1:9000");

    let client = GreeterClient::with_origin(svc, origin);

    Ok(client)
}

#[tokio::test]
async fn unary_test() -> Result<(), Box<dyn std::error::Error>> {
    let request = tonic::Request::new(HelloRequest {
        name: "grpc web client".into(),
    });

    let response = make_greeter_client()?.say_hello(request).await?;

    assert_eq!(response.into_inner(), HelloReply { message: "Hello grpc web client!".to_string() });

    Ok(())
}
