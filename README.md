hubspot용 funsms kako, sms 연동 앱

신규 funsms연동 계약 발생시 

1. https 도메인 생성
   - gcp console 로그인
      
   - 대상 vpc 선택
   - 방화벽 http 허용
   - 방화벽 전용 port open
   - 고객 dns 입력
   - /etc/nginx/conf.d/ 에 고객사 conf 파일 생성
   - sudo certbot certonly 로 https 키 생성
   
2. private app 생성
   
3. developer app 생성
   - 앱이름 생성 : ex) 고객명_kakao
   - 권한 선택 : contact reqd, workflow read
   
4. 이 소스를 복사해서 고객사 전용 폴더 생성
   - /home/developer/kakaoapps_node/고객사폴더
   
5. 프로그램 환경설정
   - .env파일에 정보 입력
   - private app key
   - developer app key
   - 고객앱 도메인 : ex) ws...

6. contact, workflow extention 생성
   - .config/actions폴더 api 스크립트 이용

7. 정상작동 테스트
    - hubspot contact 우측 하단에 kakao, sms extension이 보이는가
    - hubspot workflow에 kakao, sms extension이 보이는가



