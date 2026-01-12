package docker.security

# Deny images from untrusted registries
deny[msg] {
    input[i].Cmd == "from"
    val := input[i].Value
    not startswith(val[0], "node:")
    not startswith(val[0], "alpine:")
    not contains(val[0], "gcr.io/")
    not contains(val[0], "docker.io/")
    msg := sprintf("Image %v is from an untrusted registry", [val[0]])
}

# Require non-root user
deny[msg] {
    not user_defined
    msg := "Dockerfile must specify a non-root USER"
}

user_defined {
    input[i].Cmd == "user"
    input[i].Value != ["root"]
}

# Deny use of latest tag
deny[msg] {
    input[i].Cmd == "from"
    val := input[i].Value[0]
    endswith(val, ":latest")
    msg := sprintf("Base image %v uses 'latest' tag", [val])
}

# Require HEALTHCHECK
deny[msg] {
    not healthcheck_defined
    msg := "Dockerfile must include HEALTHCHECK instruction"
}

healthcheck_defined {
    input[i].Cmd == "healthcheck"
}

# Deny ADD when COPY should be used
warn[msg] {
    input[i].Cmd == "add"
    msg := "Consider using COPY instead of ADD unless you need tar extraction or URL fetching"
}

# Require explicit version pinning for apt-get
deny[msg] {
    input[i].Cmd == "run"
    val := concat(" ", input[i].Value)
    contains(val, "apt-get install")
    not contains(val, "=")
    msg := "apt-get install should use explicit version pinning"
}
