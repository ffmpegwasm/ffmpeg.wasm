# Docker Desktop WSL2 Setup - Quick Reference

## Problem

```
The command 'docker' could not be found in this WSL 2 distro.
We recommend to activate the WSL integration in Docker Desktop settings.
```

## Solution: Enable WSL Integration

### Step-by-Step Instructions

1. **Open Docker Desktop** (on Windows, not in WSL)
   - Look for Docker icon in system tray
   - Click it and select "Dashboard"

2. **Go to Settings**
   - Click the gear icon (⚙️) in top right
   - Or File → Settings

3. **Navigate to Resources → WSL Integration**
   ```
   Settings → Resources → WSL Integration
   ```

4. **Enable Integration**
   - Toggle ON: "Enable integration with my default WSL distro"
   - Find your distro in the list (likely "Ubuntu" or "Ubuntu-22.04")
   - Toggle the switch next to your distro name to ON
   - Click "Apply & Restart"

5. **Wait for Docker to Restart**
   - This may take 30-60 seconds
   - Watch for "Docker Desktop is running" notification

6. **Test in WSL**

   Open your WSL terminal and run:

   ```bash
   # Should show version (not error)
   docker --version

   # Should show system info
   docker info

   # Test run (should download and run)
   docker run hello-world
   ```

   **Expected output:**
   ```
   Hello from Docker!
   This message shows that your installation appears to be working correctly.
   ```

## Troubleshooting

### Issue: Docker Desktop not installed

**Symptom:**
```
-bash: /mnt/c/Program Files/Docker/Docker/Docker Desktop.exe: No such file or directory
```

**Solution:**
Download from https://www.docker.com/products/docker-desktop/

### Issue: WSL Integration toggle grayed out

**Symptom:** Can't enable the toggle

**Solutions:**
1. Update Docker Desktop to latest version
2. Update WSL: `wsl --update` (in Windows PowerShell)
3. Restart both Docker Desktop and WSL

### Issue: "error during connect"

**Symptom:**
```
error during connect: This error may indicate that the docker daemon is not running
```

**Solutions:**
1. Ensure Docker Desktop is actually running (check system tray)
2. Restart Docker Desktop
3. In Docker Desktop settings: "Use WSL 2 based engine" should be checked
4. Try restarting WSL: `wsl --shutdown` (in PowerShell), then reopen WSL

### Issue: Permission denied

**Symptom:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Logout and login again (or restart WSL)
wsl --shutdown  # Run in PowerShell
# Then reopen WSL terminal
```

## Verify Complete Setup

Once working, these should all succeed:

```bash
# 1. Docker version
docker --version
# Output: Docker version 24.x.x, build xxxxx

# 2. Docker info
docker info | head -20
# Should show Server info, not errors

# 3. Test build (in ffmpeg.wasm directory)
docker buildx version
# Output: github.com/docker/buildx vx.x.x

# 4. Test simple build
docker run --rm alpine echo "Docker works in WSL!"
# Output: Docker works in WSL!
```

## Alternative: Use Docker in Windows (Not Recommended)

If WSL integration keeps failing, you can run Docker commands from Windows PowerShell, but this is slower and more complex:

```powershell
# In PowerShell (not WSL)
cd C:\path\to\ffmpeg.wasm
docker buildx build .
```

But this defeats the purpose of WSL development. Fix the WSL integration instead.

## Next Steps After Docker Works

1. Return to WSL terminal
2. Navigate to ffmpeg.wasm: `cd ~/repos/ffmpeg.wasm`
3. Test build: `make prd`
4. Continue with Phase 0 baseline measurements

## Quick Reference Card

| Task | Command (in WSL) |
|------|------------------|
| Check Docker installed | `docker --version` |
| Check Docker running | `docker info` |
| Test Docker works | `docker run hello-world` |
| Build ffmpeg.wasm (ST) | `make prd` |
| Build ffmpeg.wasm (MT) | `make prd-mt` |
| Check build output | `ls -lh packages/core/dist/umd/` |

---

**Need help?** Ask me to walk through any specific step!
