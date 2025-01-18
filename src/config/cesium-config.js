import { Ion } from 'cesium';

// Get your token from https://ion.cesium.com/tokens after creating an account
export const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZjYyMTI0NC1mZTZiLTRkZjItYjg0Yy1mNDg1YjllNTdmNjIiLCJpZCI6MjY5ODUwLCJpYXQiOjE3MzcyMDkzNTF9.WVH4B5FLUuVVuMwrt-O4g9nVmZkB4zF3Pa6RT7F8X1s';

export const initializeCesium = () => {
  Ion.defaultAccessToken = CESIUM_ION_TOKEN;
};
