import * as fs from 'fs';
const { writeFile, readFile } = fs.promises;
import { join, dirname } from 'path';

const TEMP_DIRECTORY = '.temp';
const COOKIE_DIRECTORY = 'cookie';

export const saveFileToTemp = async (path: string, data: any) => {
  const filePath = join(TEMP_DIRECTORY, path);
  
  const dirName = dirname(filePath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(data, null));
};

export const saveCookie = async (path: string, data: any) => {
  const cookiePath = join(COOKIE_DIRECTORY, path);
  await saveFileToTemp(cookiePath, data);
};

export const readFileFromTemp = async (path: string) => {
  const filePath = join(TEMP_DIRECTORY, path);
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = await readFile(filePath);
    return JSON.parse(fileBuffer.toString());
  }
  return null;
};

export const getCookie = async (path: string) => {
  const cookiePath = join(COOKIE_DIRECTORY, path);
  return  await readFileFromTemp(cookiePath);
};
