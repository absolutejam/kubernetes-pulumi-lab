```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Regenerating CA                                                    ┃
┗━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ┃  ┏━━━━┓
  ┣━━┫DONE┃ Generating root key
  ┃  ┗━━━━┛
  ┃  ┏━━━━┓
  ┣━━┫FAIL┃ Generating CA key
  ┃  ┗━┳━━┛
  ┃    ┃
  ┃    ┃  Taking longer than usual...
  ┃    ┃
  ┃    ┃   ┏━━━━┓
  ┃    ┣━━━┫DONE┃ Generating CA cert
  ┃    ┃   ┗━━━━┛
  ┃    ┃   ┏━━━━┓
  ┃    ┣━━━┫FAIL┃ Generating CA cert
  ┃    ┃   ┗━━━━┛
  ┃    ┃
  ┃    ┃  A thing happene that is really, really
  ┃    ┃  bad.
  ┃    ┃
  ┃    ┃   ┏━━━━┓
  ┃    ┗━━━┫PEND┃ Generating CA cert
  ┃        ┗━━━━┛
  ┃  ┏━━━━┓
  ┗━━┫PEND┃ Generating CA cert
     ┗━┳━━┛
       ┃   ┏━━━━┓
       ┣━━━┫DONE┃ Generating CA cert
       ┃   ┗━━━━┛
       ┃   ┏━━━━┓
       ┣━━━┫FAIL┃ Generating CA cert
       ┃   ┗━━━━┛
       ┃   ┏━━━━┓
       ┗━━━┫PEND┃ Generating CA cert
           ┗━━━━┛
```

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Regenerating CA                                                   ┃
┗━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ┃
  ┣━━□ Generating root key ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DONE
  ┃
  ┣━━□ Generating CA key ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAIL
  ┃     ┃
  ┃     ┃  Taking longer than usual...
  ┃     ┃  Taking longer than usual...
  ┃     ┃  Taking longer than usual...
  ┃     ┃
  ┃     ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKIP
  ┃     ┃
  ┃     ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAIL
  ┃     ┃
  ┃     ┃  A thing happene that is really, really, really bad,
  ┃     ┃  and should not be ignored.
  ┃     ┃
  ┃     ┗━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
  ┃
  ┗━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┃
        ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┃
        ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┃
        ┗━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Regenerating CA                                                   ┃
┗━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ┣━━□ Generating root key ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DONE
  ┣━━□ Generating CA key ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAIL
  ┃     ┃
  ┃     ┃  Taking longer than usual...
  ┃     ┃  Taking longer than usual...
  ┃     ┃  Taking longer than usual...
  ┃     ┃
  ┃     ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SKIP
  ┃     ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FAIL
  ┃     ┃
  ┃     ┃  A thing happene that is really, really, really bad,
  ┃     ┃  and should not be ignored.
  ┃     ┃
  ┃     ┗━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
  ┃
  ┗━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┣━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
        ┗━━━□ Generating CA cert ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PEND
```

```
Regenerating CA
[1.1] Generate CA key / Setup key
[2.1] Generate CA cert / Rotating things
[2.2] Generate CA cert / Setup key
[3.1] Generate token / Doing thing
```
