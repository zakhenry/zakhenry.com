## Run commands

### TCP Server

Run
```shell
cargo lambda watch --bin tcp-server
```


### Lambda Server

Run lambda
```shell
cargo run --bin lambda-server
```

Build for AWS
```shell
cargo lambda build --bin lambda-server --release --output-format zip --arm64
```
