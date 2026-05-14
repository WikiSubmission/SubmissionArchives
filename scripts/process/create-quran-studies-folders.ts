import fs from 'fs';
import path from 'path';

const titles = [
    "01 Quran Study From Azhar 1 Sura 72;19 28 & Sura 73 By Kathryn Jinns 05 26 1989",
    "02 Quran Study From Azhar 2 Sura 95 & Sura 96 By M Sabahi Two Verses Of Sura 9 Dropped Out To Demons",
    "03 Quran Study From Azhar 3 Sura 10;79 92 & Sura 23 By Rashad's Khutba 01 19 1990 Sura 3;110 117 By",
    "04 Quran Study From Azhar 4 Sura 37 By Rashad Shakira Present Astroid 01 21 1990 Sura 3;118 129 By S",
    "05 Quran Study From Azhar 5 Sura 56;75 & Sura 57 By Lisa 02 17 1989",
    "06 Quran Study From Azhar 6 Sura 59 By Donna PRA Invisible Giants Hypocrites 03 10 1989",
    "07 Quran Study From Azhar 7 Sura 62 & Sura 63 By Kathryn God's Religion Will Dominate In 20 To 50 Yr",
    "08 Quran Study From Azhar 8 Sura 65 & Sura 66 By Lori Encourage Children To Do Salat Hamid Argues 04",
    "09 Quran Study From Azhar 9 Sura 70 By Edip Chastity Worry Edip Wanted Rashad To Change Rich Believe",
    "10 10 Quran Study From Azhar 10 Sura 71 & Sura 72 By Afameh Chastity Jinns 05 19 1989",
    "11 11 Quran Study From Behrouz 111 Sura 23;60 88 & Sura 16 01 18 199001 23 1990 Morning Before 01 31 19",
    "12 12 Quran Study From Behrouz 212 Behrouz's Khutba Edip Yuksel's Exposure 01 25 1990",
    "13 13 Quran Study From Behrouz 313 Sura 7;12 By Rashad Adam & Eve's Body 12 24 1989",
    "14 14 Quran Study From Behrouz 414 Night Of Destiny Zikr By Rashad",
    "15 15 Quran Study From Behrouz 515 Sura 54;23 By Rashad Sura 55 & Sura 56 & Sura 51 Age 40 & First Gen",
    "16 16 Quran Study From Behrouz 616 Sura 64 By Rashad Nothing Happens Except Sura 70 By Edip Worry Chast",
    "17 17 Quran Study From Behrouz 717 Sura 90 & Sura 91 By Rashad Sura 82 & Sura 83 By Edip 07 21 1989No 7",
    "18 18 Quran Study From Behrouz 818 Sura 61 & Sura 87 & Sura 94 By Rashad Sura 81 By Edip No 8",
    "19 19 Quran Study From Behrouz 919 Sura 2;89 119 Witchcraft Reverting Intro To Blue Quran No 13",
    "20 20 Quran Study From Behrouz 1020 Sura 3 By M Sabahi Insurance Fear Worry",
    "21 21 Quran Study From Behrouz 1121 Sura 9;52 By Rashad The Hypocrites Apology To Parivash Sura 56;75 B",
    "22 22 Quran Study From Behrouz 1222 Sura 39;11 By Rashad Admission Test I Don't Compromise With A Littl",
    "23 23 Quran Study From Behrouz 1323 Sura 51 By Douglas New Era Believers Are Protected From Accidents &",
    "24 24 Quran Study From Behrouz 1424 Sura 55 By Lori Alfatehe Sura 56 By Naghmeh",
    "25 25 Quran Study From Behrouz 1525 Sura 58 By Robert",
    "26 26 Quran Study From Behrouz 1626 Sura 67 By Gatut Hamid Argues With Rashad",
    "27 27 Quran Study From Behrouz 1727 Sura 14;19 Chastity Premarital Pregnancy Sura 17;47 We Are Allowed",
    "28 28 Quran Study From Parivash 128 Sura 45;33 Parivash's Home 19 Math",
    "29 29 Quran Study From Parivash 229 Mehri's Questions Admission Test & Final Test Tucson 1985",
    "30 30 Quran Study From Parivash 330 Sura 28 & Sura 57 Insurance With GOD Sura 45;33 Rashad Was Told To",
    "31 31 Quran Study From Parivash 431 Sura 18;98 & Sura 81 Edip Azan & Salat By Rashad 11 04 1989",
    "32 32 Quran Study From Parivash 532 Sura 60 & Sura 61 Rich Believer Certainty Insurance 114 Min 12 28 8",
    "33 33 Quran Study From Parivash 633 Sura 74 Masud Sabahi 06 02 1989",
    "34 34 Quran Study From Parivash 734 Sura 33 GOD Is Physical Innovations Praying & Prostrating After Sal",
    "35 35 Quran Study From Parivash 835 Sura 30;25 Miracle Coming Out Of Biggest Brewery Intercession Alleg",
    "36 36 Quran Study From Parivash 936 After Fajr Prayer I Make Deliberate Mistakes To Destroy Idols Origi",
    "37 37 Quran Study From Parivash 1037 Shakira's Home Sura 11;68 11 04 1989",
    "38 38 Quran Study From Parivash 1138 Certainty 11 29 1989",
    "39 39 Quran Study From Parivash 1239 Sura 60 & Sura 61 Rich Believer Certainty Insurance 114 Min 12 28",
    "40 40 Quran Study From Parivash 1340 Sura 3;59 12 29 1989",
    "41 41 Quran Study From Parivash 1441 Sura 54 By Rashad Alfateha For Anything You Wish Extreme Libertari",
    "42 42 Quran Study From Roxana 142 Interview With Rashad By Ray Caton Insurance Interest",
    "43 43 Quran Study From Roxana 243 Third International Conference Tucson Rashad's Speech Sura 17;39 Insu",
    "44 44 Quran Study From Roxana 344 Sura 64 By Rashad Nothing Happens Angels Are Best Surgons Sura 59 By",
    "45 45 Quran Study From Roxana 445 Sura 40 By Rashad Firoz's Home Deja Vu Believers Usually 95 Yrs Old F",
    "46 46 Quran Study From Roxana 546 Sura 37;159 To 38;25 Sura 9;50 & Sura 39;11 Admission Test I Don't Co",
    "47 47 Quran Study From Roxana 647 Introduction To Blue Quran Sura 1 & Beginning Of Sura 2",
    "48 48 Quran Study 48 Rashad's Speech Parivash's Home Salat Zakat Fazeli A Muhamaden Argues 01 11 1989",
    "49 49 Quran Study 49 Speech Of Rashad Parivash's Home 19 Math 11 05 1989",
    "50 50 Quran Study 50 Sura 92 & Sura 93 & Sura 94 By Kathryn Zakat Not Limited To Earned Money 07 27 198",
    "51 51 Quran Study 51 Sura 17;59 Rashad 1990",
    "52 52 Quran Study 5⧸8⧸89 by Linda Sura 1 & 2 partial"
];

const targetBaseDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\Audios\\quran-studies';

function sanitizeTitle(title: string) {
    // Remove leading number (e.g. "02 ") or "10 10 "
    let s = title.replace(/^\d+(\s+\d+)?\s+/, '');
    // Replace the special solidus extension character with a dash or underscore
    s = s.replace(/⧸/g, '_');
    // Remove characters not allowed in filenames
    s = s.replace(/[:"&'?*<>|;]/g, '').replace(/\s+/g, '_');
    return s;
}

if (!fs.existsSync(targetBaseDir)) {
    fs.mkdirSync(targetBaseDir, { recursive: true });
}

titles.forEach((title: string) => {
    const folderName = sanitizeTitle(title);
    const folderPath = path.join(targetBaseDir, folderName);
    if (!fs.existsSync(folderPath)) {
        console.log(`Creating folder: ${folderName}`);
        fs.mkdirSync(folderPath, { recursive: true });
    } else {
        console.log(`Folder already exists: ${folderName}`);
    }
});
