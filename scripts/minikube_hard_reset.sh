#!/bin/sh

dracarys() {
  echo "          ____ __"
  echo "         { --.\  |          .)%%%)%%"
  echo "          '-._\\ | (\___   %)%%(%%(%%%"
  echo '🔥DRACARYS🔥  `\\|{/ ^ _)-%(%%%%)%%;%%%'
  echo "          .'^^^^^^^  /\`    %%)%%%%)%%%'"
  echo "         //\   ) ,  /       '%%%%(%%'"
  echo "   ,  _.'/  \`\<-- \<"
  echo "    \`^^^\`     ^^   ^^"
}

while true; do
  read -p "⚠️  Do you wish to delete the $MINIKUBE_PROFILE minikube profile? CAUTION: all data will be permanently deleted. 🔥" yn
  case $yn in
  [Yy]*)
    dracarys && minikube delete -p "$MINIKUBE_PROFILE"
    break
    ;;
  [Nn]*) exit ;;
  *) echo "Please answer y[yes] or n[no]." ;;
  esac
done
