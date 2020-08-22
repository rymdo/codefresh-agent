#!/bin/bash
set -e -u

echo 'Creating Project'
echo "$(codefresh create project codefresh-agent)"

echo 'Creating pipeline - app'
echo "$(codefresh create pipeline -f app.codefresh.spec.yml)"

echo 'Creating pipeline - ci'
echo "$(codefresh create pipeline -f ci.codefresh.spec.yml)"
