import { auth, InjectionZone } from '@strapi/helper-plugin';
import React from 'react';

const AzureButton = () => {
  const base = window?.strapi?.backendURL || ''; // Strapi setea esto
  const url = `${base.replace(/\/$/, '')}/azure/login?redirect=${encodeURIComponent(`${base}/admin`)}`;
  return (
    <a
      href={url}
      className="sc-AzureBtn"
      style={{ display:'inline-block', padding:'10px 14px', borderRadius:8, background:'#2F2F2F', color:'#fff', textDecoration:'none', marginTop:12 }}
    >
      Entrar con Microsoft
    </a>
  );
};

export default {
  register(app) {
    app.injectContent({
      area: 'admin.login.right.links',
      component: AzureButton,
      key: 'azure-sso-btn',
    });
  },
};
