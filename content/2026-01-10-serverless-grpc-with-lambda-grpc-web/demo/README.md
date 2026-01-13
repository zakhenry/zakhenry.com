## Run commands

### TCP Server

Run
```shell
cargo run --bin tcp-server
```

### Lambda Server

Run lambda
```shell
cargo lambda watch --bin lambda-server
```

Build for AWS
```shell
cargo lambda build --bin lambda-server --release --output-format zip --arm64
```
