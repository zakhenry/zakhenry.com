+++
title= "Serverless gRPC"
description= ""
date = "2026-01-10"
[taxonomies]
tags = ["serverless", "grpc", "tonic", "aws", "lambda", "rust"]
[extra]
side_toc= true
+++

{% admonition(type="tip", title="tldr") %}
Rust gRPC service running on AWS Lambda with grpc-web message transport. [Yes please](https://github.com/zakhenry/lambda-grpc-web)
{% end %}

## Setting the scene

It is January 2026, we are well past the honeymoon phase of serverless compute, and by and large discourse among 
developers is dominated by AI talk. Serverless compute has many well-justified arguments *against* its use, from high
cost, to poor performance, and difficult debugging and observability. It also has many excellent qualities, such as 
scale-to-zero costing, fully managed vulnerability patching etc.

Some teams may swear by the platform, where others swear off it entirely.

I've largely been in the latter camp. I have deployed some Node.js Lambda functions for integrating with AWS Cognito in 
the past, and have some experience with Python lambdas. These experiences were ok, but for various reasons the projects 
suffered from code rot, bugs were very difficult to trace, and the local development story was sorely lacking.
**It has never been a tool that I've reached for when a docker container running in ECS would do just fine**

Combine this with the last 8 years of API development using strictly [gRPC](https://grpc.io/) services, and writing more
and more Rust lately, I've found myself quite separate from the world of REST and untyped languages Lambdas seem to be 
tailored for.

That said, I have been **wanting** to use Lambdas for a long time - they seem like a great solution to the niche where
you have low traffic - why have a server sitting there doing *nothing* 99% of the time? Even if it is bin packed into an
EC2 instance, scale up events of many of these will cause latency spikes etc. For something like an admin dashboard 
where a handful of people might make API calls a few times a day, serverless deployment is likely a perfect fit.

## Defining requirements

There are three key requirements I would need to resolve before floating the idea of introducing Lambda into our 
deployment options  
1. Performance must not be meaningfully impacted (concretely, users must not notice cold starts)
2. Protocol must be gRPC compatible for consistency with other deployed services
3. It must be easy to switch back to ECS if usage reaches the threshold where Lambda is not cheaper

For the performance issue, I eliminate the interpreted and virtual machine options as they 
[all have poor cold  start performance](https://maxday.github.io/lambda-perf/). 
My preferred language to develop in across the stack is Rust, and it has excellent performance on 
cold starts (typically <20ms). AWS [in late 2025 announced general availability of their rust runtime](https://aws.amazon.com/about-aws/whats-new/2025/11/aws-lambda-rust/), 
so it seems to be a good fit for my goals.

gRPC is the sticking point now, as it isn't going to just work out of the box with a Rust gRPC service. Lambda doesn't
support `http/2`, which gRPC requires. The Rust de-facto gRPC framework [tonic](https://github.com/hyperium/tonic) is 
explicitly built around [hyper](https://github.com/hyperium/hyper), which is a tcp socket binding service, but Lambda 
functions don't support that.

This showed to me there was a need for something to cleanly glue these elements together, in a way that was easily 
reversed should developers want to go back to more standard deployment models.

## Introducing [`lambda-grpc-web`](https://crates.io/crates/lambda-grpc-web)

This is a fairly small crate, with a few design goals in mind

1. It must be easy to switch back and forth between deployment models
2. Limitations of Lambda environment are minimised (all features of tonic that lambda can support, must be supported)
3. It is _not_ batteries included. Dev still maintains control of local development, testing and deployment flows


Let's see how this looks, with a simple hello world demo

## Demo

We are going to take the tonic hello world service, enable grpc-web, add a unit test and convert it to a lambda service, 
and deploy it to AWS Lambda.


{% admonition(type="example", title="source") %}
For the runnable demo, refer to the Rust project at [https://github.com/zakhenry/zakhenry.com/tree/master/demos/hello-lambda-grpc-web](https://github.com/zakhenry/zakhenry.com/tree/master/demos/hello-lambda-grpc-web)
{% end %}

### Writing a standard gRPC TCP service

This project is a very basic hello world grpc service with a single unary endpoint:


```proto
// demo/proto/hello_world.proto#L4-L6

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

The implementation is barebones hello world

```rust
// demo/src/bin/tcp-server.rs#L6-L29


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

```

The main function configures the tonic server builder as follows:

```rust
// demo/src/bin/tcp-server.rs#L30-L42

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let greeter = MyGreeter::default();

    Server::builder()
        .accept_http1(true)
        .layer(GrpcWebLayer::new())
        .add_service(GreeterServer::new(greeter))
        .serve("127.0.0.1:9000".parse().unwrap())
        .await?;

    Ok(())
}
```

{% admonition(type="question", title="grpc-web?") %}
You may notice we have a `GrpcWebLayer` configured here. We'll discuss it in more detail later but for now it is 
important to understand that it is a hard requirement to have an http/1 compatible transport in order to have gRPC 
work with the AWS Lambda infrastructure.
{% end %}


Ok now we can run this service locally with 
```shell
cargo run
```

And we will see our service start happily. However now we need a client to connect to the service.

Simplest option right now is to create an integration test, since we're going to be wanting that for our own testing 
stack anyway.

Other than a somewhat verbose client setup, the test is straightforward. Make a request, assert on the response.
```rust
// demo/tests/tcp-server.rs#L43-L54

#[tokio::test]
async fn unary_test() -> Result<(), Box<dyn std::error::Error>> {
    let request = tonic::Request::new(HelloRequest {
        name: "grpc web client".into(),
    });

    let response = make_greeter_client()?.say_hello(request).await?;

    assert_eq!(response.into_inner(), HelloReply { message: "Hello grpc web client!".to_string() });

    Ok(())
}
```

### Converting our service to run on AWS Lambda

Now that we have a regular working gRPC service working locally, lets convert it to a local Lambda.

If you haven't already, you'll need to set up the excellent tool [`cargo lambda`](https://www.cargo-lambda.info/) which
handles emulation of the lambda runtime.

Now for the code changes.

First install `lambda-grpc-web`

```shell
cargo add lambda-grpc-web
```

Then 
1. swap out `tonic::transport::server::Server` for `tonic::transport::Server`,
2. remove the grpc web layer (this is part of lambda-grpc-web)
3. remove the `accept_http1` rule (implicit for lambdas; there is no alternative)
4. remove the socket address from `.serve` (socket is handled by internal lambda machinery)

**And that's it!**

<figure>
    <figcaption>Before</figcaption>

```rust
// demo/src/bin/tcp-server.rs#L30-L42

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let greeter = MyGreeter::default();

    Server::builder()
        .accept_http1(true)
        .layer(GrpcWebLayer::new())
        .add_service(GreeterServer::new(greeter))
        .serve("127.0.0.1:9000".parse().unwrap())
        .await?;

    Ok(())
}
```
</figure>
<figure>
    <figcaption>After</figcaption>

```rust
// demo/src/bin/lambda-server.rs#L30-L40

#[tokio::main]
async fn main() -> Result<(), Error> {
    let greeter = MyGreeter::default();

    LambdaServer::builder()
        .add_service(GreeterServer::new(greeter))
        .serve()
        .await?;

    Ok(())
}
```
</figure>

As you can see, the difference between a TCP service and one that runs on AWS Lambda is intentionally kept minimal.

<details>
  <summary>Expand for full diff</summary>

<figure>
    <figcaption>Server implementation</figcaption>

<!-- embedme impl.patch -->
```patch
diff --git a/demo/src/bin/tcp-server.rs b/demo/src/bin/lambda-server.rs
index 4fc3d58..80cbf77 100644
--- a/demo/src/bin/tcp-server.rs
+++ b/demo/src/bin/lambda-server.rs
@@ -1,8 +1,8 @@
 use hello_world::greeter_server::{Greeter, GreeterServer};
 use hello_world::{HelloReply, HelloRequest};
-use tonic::transport::Server;
+use lambda_grpc_web::LambdaServer;
+use lambda_grpc_web::lambda_runtime::Error;
 use tonic::{Request, Response, Status};
-use tonic_web::GrpcWebLayer;
 
 mod hello_world {
     tonic::include_proto!("helloworld");
@@ -28,14 +28,12 @@ impl Greeter for MyGreeter {
 }
 
 #[tokio::main]
-async fn main() -> Result<(), Box<dyn std::error::Error>> {
+async fn main() -> Result<(), Error> {
     let greeter = MyGreeter::default();
 
-    Server::builder()
-        .accept_http1(true)
-        .layer(GrpcWebLayer::new())
+    LambdaServer::builder()
         .add_service(GreeterServer::new(greeter))
-        .serve("127.0.0.1:9000".parse().unwrap())
+        .serve()
         .await?;
 
     Ok(())

```
</figure>
</details>

It should be trivial to switch to Lambda deploy, and back if the workload proves unsuitable. You might even consider 
having two binaries with just the different main boostrap function so you can compare both approaches, or even 
dynamically switch between strategies for some specific scenario like pre-scheduled high load.

With our gRPC service converted to lambda, we can now run it locally and run the integration tests against it

```shell
cargo lambda watch
```
and run the integration tests against it
```shell
cargo test
```

{% admonition(type="tip", title="Tip") %}
If you have more than one binary in your project, `cargo lambda` is unable to determine which function url you are 
attempting to reach, so you will need to change your test uri to `http://127.0.0.1:9000/lambda-url/{binary-name}`
{% end %}

### Deploying to AWS

To deploy to AWS refer to the [cargo lambda documentation](https://www.cargo-lambda.info/commands/deploy.html)

{% admonition(type="warning", title="Warning") %}
To quick test you'll need to make the function url fully public, but be wary of the potential expense this might incur 
if the function url is published. 

In a real production environment you will likely want to protect the lambda with auth, or have Cloudflare WAF or similar
if the endpoint is supposed to be unauthenticated.
{% end %}

Once deployed, update the uri to the generated function url and rerun your integration test. **gRPC in AWS Lambda!**

---

## Further features
`lambda-grpc-web` also supports the other features tonic provides, so it should be a breeze to enable existing `tower` 
layers, or service-specific `tonic` interceptors etc.

Additionally, to avoid confusing errors there is a specific panic handler defined which converts any panic into a gRPC
`13 INTERNAL` error, which plays nicely with existing gRPC clients. This is gated as a crate feature that can be turned 
off if you want to define your own handler.

---

## Tradeoffs
Unfortunately due to limitations of the lambda runtime, there are tradeoffs to be aware of, and consider up front if 
they are disqualifying for your intended use-case. 

### grpc-web

Mentioned earlier, we are required to downgrade the message transport with the grpc-web protocol as AWS Lambda does not
support http/2.

{% admonition(type="question", title="What is grpc-web?") %}
grpc-web is effectively a constrained gRPC dialect designed to survive hostile HTTP/1 infrastructure.
It removes some of the stream capabilities, flow control, and packs trailers into the body. 
{% end %}

Depending on target client, this isn't a huge tradeoff, especially as you might already be wanting to connect to the 
service with a browser, and so would already need to have either a conversion at the service, or a converting reverse 
proxy like [Envoy](https://www.envoyproxy.io).

A common frustration with grpc-web is that common testing tools like Postman don't natively work with grpc-web.

### Client cancellation
Since Lambda doesn't manage the TCP connection, it is unaware of the client disconnecting, and does not signal to the 
runtime that there is nothing on the other end to respond to. This can result in certain workloads spending more on 
compute than necessary.
When designing an endpoint, it is important to make server side response deadlines and implement cancellation if the 
duration is expected to be non-trivial (and is cancellable). 

### Time limit
AWS Lambda has a hard time limit of 15 minutes, which makes this approach unsuited for long term streaming requests. 
However, due to lambda costing more for long durations anyway this is not a good fit for that kind of workload anyway.

### Cost
The niche this approach fills is explicitly low traffic volumes. With sustained traffic, ECS is cheaper and better.
<sup>*This might change with Lambda Managed*</sup>

{% admonition(type="abstract", title="") %}
This is *not* intended as a general replacement for gRPC servers or REST APIs — it's a deliberately narrow solution for
low-traffic, gRPC-first stacks.
{% end %}

---

## Future work

### Lambda Managed
In November, AWS announced [Lambda Managed](https://aws.amazon.com/lambda/lambda-managed-instances) which allows lambda 
functions to be run on your EC2 instances, effectively eliminating the main cost downsides of Lambda. It also adds 
concurrency support. The rust runtime has experimental support for this, and I intend to add explicit support for it in
`lambda-grpc-web`.

### Envoy reverse conversion
Since there is a good chance stacks might have Envoy as service mesh management, I've been tinkering with developing a 
reverse conversion such that clients with envoy in between could make *either* gRPC standard, or grpc-web calls and it
would just work. This is a work in progress as I [ran into a roadblock](https://github.com/envoyproxy/envoy/issues/42559) 
with Envoy custom extensions lacking some required features.

---

## Wrap up
I hope this new capability finds itself some interesting niches for use in the world. I'm intending to use it as a dirt
cheap (likely well inside free tier) way of deploying low traffic APIs.

Please have a look at the [repo](https://github.com/zakhenry/lambda-grpc-web), there are examples and integration tests 
that explore more capability like streaming and middleware.

As a final note, I did this not because I think it should be the next big thing, I did it because it's an interesting 
challenge, and in a relatively unexplored cloud compute niche that I believe has interesting potential. 
