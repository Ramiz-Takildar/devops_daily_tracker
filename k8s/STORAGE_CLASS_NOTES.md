# Storage Class Configuration Notes

## Current Storage Class Behavior

Your Kubernetes cluster uses a storage class with **WaitForFirstConsumer** binding mode:

```
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer
```

## What This Means

### WaitForFirstConsumer Binding Mode

PersistentVolumeClaims (PVCs) will **NOT** bind immediately when created. Instead, they remain in `Pending` state until:

1. A pod is scheduled that uses the PVC
2. The pod's node is selected
3. The storage provisioner creates the volume on that specific node

This is **normal behavior** and not an error.

## Impact on Deployment

### Expected Behavior

1. **PVC Creation**: PVCs are created in `Pending` state
   ```bash
   kubectl get pvc -n devops-tracker
   # Shows: STATUS = Pending
   ```

2. **Pod Scheduling**: When pods start, they trigger PVC binding
   ```bash
   kubectl get pods -n devops-tracker
   # Pods may show: ContainerCreating
   ```

3. **PVC Binding**: PVCs bind automatically when pods need them
   ```bash
   kubectl get pvc -n devops-tracker
   # Shows: STATUS = Bound
   ```

### Timeline

- **backend-exports-pvc**: Binds when backend pod starts
- **postgres-data-pvc**: Binds when PostgreSQL StatefulSet pod starts (created by volumeClaimTemplate)

## Verification Steps

### 1. Check PVC Status
```bash
kubectl get pvc -n devops-tracker
```

Expected during deployment:
```
NAME                  STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS
backend-exports-pvc   Pending                                      standard
```

### 2. Check Pod Status
```bash
kubectl get pods -n devops-tracker
```

Pods will show `ContainerCreating` while waiting for PVC binding.

### 3. Wait for Binding
PVCs will automatically bind within 1-2 minutes after pods start.

```bash
# Watch PVC status
kubectl get pvc -n devops-tracker -w

# Watch pod status
kubectl get pods -n devops-tracker -w
```

## Troubleshooting

### PVC Stuck in Pending After Pod Starts

If PVC remains `Pending` after pod is scheduled:

1. **Check Events**:
   ```bash
   kubectl describe pvc backend-exports-pvc -n devops-tracker
   ```

2. **Check Storage Provisioner**:
   ```bash
   kubectl get pods -n kube-system | grep local-path
   ```

3. **Check Node Resources**:
   ```bash
   kubectl describe node
   ```

### Common Issues

#### Issue: "No nodes available"
**Solution**: Ensure your Kubernetes cluster has at least one ready node
```bash
kubectl get nodes
```

#### Issue: "Insufficient storage"
**Solution**: Check available disk space on nodes
```bash
df -h
```

#### Issue: "Provisioner not found"
**Solution**: Verify storage provisioner is running
```bash
kubectl get pods -n kube-system -l app=local-path-provisioner
```

## Alternative: Immediate Binding

If you need immediate PVC binding (not recommended for production):

### Option 1: Change Storage Class Binding Mode

Create a new storage class with `Immediate` binding:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard-immediate
provisioner: rancher.io/local-path
volumeBindingMode: Immediate
reclaimPolicy: Delete
```

Then update PVC to use this storage class:
```yaml
spec:
  storageClassName: standard-immediate
```

### Option 2: Use hostPath Volumes (Development Only)

For local development, you can use hostPath volumes:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: backend-exports-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/backend-exports
    type: DirectoryOrCreate
```

**Warning**: hostPath volumes are not suitable for production use.

## Recommended Approach

**Keep the default WaitForFirstConsumer mode** - it's the best practice because:

1. ✅ Ensures volumes are created on the correct node
2. ✅ Prevents scheduling conflicts
3. ✅ Optimizes storage locality
4. ✅ Works correctly with node affinity and topology

Simply **wait for pods to start** and PVCs will bind automatically.

## Updated Deployment Process

The deployment script has been updated to handle WaitForFirstConsumer correctly:

1. Create PVCs (they remain Pending - this is normal)
2. Deploy PostgreSQL StatefulSet (creates its own PVC via volumeClaimTemplate)
3. Deploy Backend (triggers backend-exports-pvc binding)
4. Deploy Frontend
5. All PVCs bind automatically as pods start

**No manual intervention required** - the process is fully automated.

---

**Date**: 2026-05-02  
**Status**: ✅ Documented and Resolved
