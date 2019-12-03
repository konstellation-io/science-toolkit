#!/usr/bin/env bash

function replace_env() {
    INPUT=$1
    OUTPUT=$(echo $INPUT | sed -e 's/\.tpl//')

    echo "Replacing env to '$INPUT' into '$OUTPUT'"
    envsubst < $INPUT > $OUTPUT
}

export -f replace_env

# skip tpls that starts with _
find . -name "*.tpl" -not -name "_*.tpl" -exec bash -c 'replace_env "{}"' \;
