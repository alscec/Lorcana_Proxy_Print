package kubernetes.admission

# Deny containers running as root
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    input.request.object.spec.containers[i].securityContext.runAsUser == 0
    msg := sprintf("Container %v is running as root user", [input.request.object.spec.containers[i].name])
}

# Deny containers without resource limits
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    not input.request.object.spec.containers[i].resources.limits
    msg := sprintf("Container %v does not have resource limits", [input.request.object.spec.containers[i].name])
}

# Deny privileged containers
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    input.request.object.spec.containers[i].securityContext.privileged
    msg := sprintf("Container %v is privileged", [input.request.object.spec.containers[i].name])
}

# Require readiness probes
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    not input.request.object.spec.containers[i].readinessProbe
    msg := sprintf("Container %v does not have a readiness probe", [input.request.object.spec.containers[i].name])
}

# Require liveness probes
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    not input.request.object.spec.containers[i].livenessProbe
    msg := sprintf("Container %v does not have a liveness probe", [input.request.object.spec.containers[i].name])
}

# Deny containers with latest tag
deny[msg] {
    input.request.kind.kind == "Pod"
    some i
    image := input.request.object.spec.containers[i].image
    endswith(image, ":latest")
    msg := sprintf("Container %v uses 'latest' tag", [input.request.object.spec.containers[i].name])
}

# Require specific labels
deny[msg] {
    input.request.kind.kind == "Pod"
    not input.request.object.metadata.labels.app
    msg := "Pod must have 'app' label"
}

# Deny host network access
deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostNetwork
    msg := "Pod cannot use host network"
}

# Deny host PID namespace
deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostPID
    msg := "Pod cannot use host PID namespace"
}

# Deny host IPC namespace
deny[msg] {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostIPC
    msg := "Pod cannot use host IPC namespace"
}
