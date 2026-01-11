use hello_world::greeter_server::{Greeter, GreeterServer};
use hello_world::{HelloReply, HelloRequest};
use lambda_grpc_web::LambdaServer;
use lambda_grpc_web::lambda_runtime::Error;
use tonic::{Request, Response, Status};

mod hello_world {
    tonic::include_proto!("helloworld");
}

#[derive(Debug, Default)]
pub struct MyGreeter {}

#[tonic::async_trait]
impl Greeter for MyGreeter {
    async fn say_hello(
        &self,
        request: Request<HelloRequest>,
    ) -> Result<Response<HelloReply>, Status> {
        println!("Got a request: {:?}", request);

        let reply = HelloReply {
            message: format!("Hello {}!", request.into_inner().name),
        };

        Ok(Response::new(reply))
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let greeter = MyGreeter::default();

    LambdaServer::builder()
        .add_service(GreeterServer::new(greeter))
        .serve()
        .await?;

    Ok(())
}
