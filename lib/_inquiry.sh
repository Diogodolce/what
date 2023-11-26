#!/bin/bash

get_backend_url() {
  
  print_banner
  printf "${GREEN}  Digite o domínio-endereco url da sua API:${GRAY_LIGHT}"
  printf "\n\n"
  read -p "> " backend_url
}

get_urls() {
  get_backend_url
}

software_update() {
  backend_update
}

inquiry_options() {
  
  print_banner
  printf "${GREEN}  O que você precisa fazer?${GRAY_LIGHT}"
  printf "\n\n"
  printf "   [1] Instalar BlackSider API\n"
  printf "   [2] Atualizar conector de Whatsapp da  BlackSider API\n"
  printf "\n"
  read -p "> " option

  case "${option}" in
    1) get_urls ;;

    2) 
      software_update 
      exit
      ;;

    *) exit ;;
  esac
}

