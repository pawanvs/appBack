docker rm -f appback
docker build -t appback .
docker run -d       --env-file .env --name appback -p 15000:15000 -v "$PWD":/usr/src/app -w /usr/src/app appback
docker logs -f appback

