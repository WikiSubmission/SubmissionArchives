import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const srcDir = path.join(ROOT, '1981 appendix');
const destDir = path.join(ROOT, 'public', 'content', 'appendix', 'thumbnails', '1982');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const mapping = {
    'introduction.png': 'Appendix_Intro_Page_1.png',
    'appendix-1.png': 'Appendix_1_Page_2.png',
    'appendix-2.png': 'Appendix_2_Page_15.png',
    'appendix-3.png': 'Appendix_3_Page_17.png',
    'appendix-4.png': 'Appendix_4_Page_19.png',
    'appendix-5.png': 'Appendix_5_Page_20.png',
    'appendix-6.png': 'Appendix_6_Page_21.png',
    'appendix-7.png': 'Appendix_7_Page_23.png',
    'appendix-8.png': 'Appendix_8_Page_24.png',
    'appendix-9.png': 'Appendix_9_Page_25.png',
    'appendix-10.png': 'Appendix_10_Page_26.png',
    'appendix-11.png': 'Appendix_11_Page_30.png',
    'appendix-12.png': 'Appendix_12_Page_34.png',
    'appendix-13.png': 'Appendix_13_Page_35.png',
    'appendix-14.png': 'Appendix_14_Page_36.png',
    'appendix-15.png': 'Appendix_15_Page_37.png',
    'appendix-16.png': 'Appendix_16_Page_38.png',
    'appendix-17.png': 'Appendix_17_Page_40.png',
    'appendix-18.png': 'Appendix_18_Page_41.png',
    'appendix-19.png': 'Appendix_19_Page_43.png',
};

for (const [destName, srcName] of Object.entries(mapping)) {
    const srcPath = path.join(srcDir, srcName);
    const destPath = path.join(destDir, destName);
    if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.log(`Moved ${srcName} -> ${destName}`);
    } else {
        console.log(`Missing ${srcName}`);
    }
}
