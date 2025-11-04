# Force Rebuild Product Service

If Skaffold is using cached images and not picking up new code changes:

## Quick Fix (Recommended)
1. In the Skaffold terminal, press `r` to rebuild all images
2. Or stop Skaffold (Ctrl+C) and run:
   ```bash
   skaffold dev --no-cache
   ```

## Alternative: Force Rebuild Single Service
```bash
# Delete the product-service pod
kubectl delete pod -l app=product-service

# Or delete all pods to force rebuild
kubectl delete pods --all
```

## Verify File Sync
After rebuild, check if files are synced:
```bash
kubectl exec -it <product-service-pod-name> -- ls -la /app/src/controllers/getCategories.ts
```

## If Still Not Working
1. Stop Skaffold completely
2. Clear Docker cache:
   ```bash
   docker system prune -a
   ```
3. Restart Skaffold:
   ```bash
   skaffold dev --no-cache
   ```

