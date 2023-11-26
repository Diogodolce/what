#!/bin/bash
#
# Print banner art.

#######################################
# Print a board. 
# Globals:
#   BG_BROWN
#   NC
#   WHITE
#   CYAN_LIGHT
#   RED
#   GREEN
#   YELLOW
# Arguments:
#   None
#######################################
print_banner() {

  clear

  printf "\n\n"

  printf "${CYAN_LIGHT}";
  printf "  888888b.   888      888    d8P\n";  
  printf " 888  "88b  888      888   d8P  \n";
  printf " 888  .88P  888      888  d8P   \n"; 
  printf " 8888888K.  888      888d88K    \n"; 
  printf " 888  "Y88b 888      8888888b   \n"; 
  printf " 888    888 888      888  Y88b  \n"; 
  printf " 888   d88P 888      888   Y88b \n"; 
  printf " 8888888P"  88888888 888    Y88b\n";
  printf "        d8888 8888888b. 8888888 \n"; 
  printf "       d88888 888   Y88b  888   \n"; 
  printf "      d88P888 888    888  888   \n"; 
  printf "     d88P 888 888   d88P  888   \n"; 
  printf "    d88P  888 8888888P"   888   \n"; 
  printf "   d88P   888 888         888   \n"; 
  printf "  d8888888888 888         888   \n"; 
  printf " d88P     888 888       8888888 \n"; 
  printf "\n";
  printf "BLACKSIDER API - DESPERTE!\n";
  printf "\n";
  printf "BLACKSIDER API - FABIO\n";
  printf "${NC}";

  printf "\n"
}