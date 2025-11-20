export default ({ env }) => ({
  'azure-oauth': {
    enabled: true,
    resolve: './src/plugins/strapi-plugin-azure-oauth'
  },
});
