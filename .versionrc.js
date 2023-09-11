module.exports = {
    // skip: {
    //     tag: true,
    // },
    releaseCommitMessageFormat:
        "🔧 build: v{{currentTag}}",
    bumpFiles: [
        {
            filename: "package.json",
            // The `json` updater assumes the version is available under a `version` key in the provided JSON document.
            type: "json",
        },
    ],
};