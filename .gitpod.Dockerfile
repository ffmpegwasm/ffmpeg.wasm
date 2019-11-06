FROM gitpod/workspace-full
RUN sudo apt-get update && sudo apt-get install -y libx11-xcb-dev libxcomposite-dev libxcursor-dev libxdamage-dev libxi-dev
