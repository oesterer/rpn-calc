// swift-tools-version: 5.7

import PackageDescription

let package = Package(
    name: "RPNCalcApp",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .executable(
            name: "RPNCalcApp",
            targets: ["RPNCalcApp"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "RPNCalcApp",
            dependencies: [],
            path: "Sources/RPNCalcApp",
            swiftSettings: [
                .unsafeFlags(["-parse-as-library"], .when(platforms: [.macOS]))
            ]
        )
    ]
)
