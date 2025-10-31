// build.rs - Compile Protocol Buffers for gRPC
//
// This build script compiles the a2a.proto file into Rust code using tonic_build.
// The generated code is only included when the "grpc" feature is enabled.

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Only compile proto files when the "grpc" feature is enabled
    #[cfg(feature = "grpc")]
    {
        tonic_build::compile_protos("proto/a2a.proto")?;
    }

    Ok(())
}
