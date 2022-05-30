# einfo-erzeszow-aggregate

The micro app gathering buses possitions from einfo.erzeszow.pl

The app was written few years ago after adding a security layer to the website blocking possibility to gathering data.

When you visit http://einfo.erzeszow.pl/Home/CNR_GetVehicles?r=0A&d=&nb=
then you will get 404 (page not found) error.
In fact there are data given but the valid header need to be sent.

After deeper investigation [@partikus](https://github.com/partikus) have found the accept lang query header is missing incl. valid number that need to be taken from the evaluated JS code.

```
npm install
npm run app
```


