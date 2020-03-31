#!/bin/sh

## Usage:
##   delete_usertools.sh CODESERVER1 CODESERVER2 ... CODESERVER_N

CODESERVERS=$*
NAMESPACE=toolkit

show_header() {
  printf "\n\n##    %-30s\n" "$@"
}

for CODESERVER in $CODESERVERS; do
    show_header "Deleting usertools '$CODESERVER' "
    kubectl delete usertools $CODESERVER -n $NAMESPACE --force --grace-period 0
done

echo "Done"
