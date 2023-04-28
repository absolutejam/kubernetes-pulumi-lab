import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '5s',
};

export default function () {
  http.get('http://localhost:8090/production');
}