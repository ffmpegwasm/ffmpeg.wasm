FROM gitpod/workspace-full
RUN sudo apt-get update && sudo apt-get install -y libx11-xcb-dev
