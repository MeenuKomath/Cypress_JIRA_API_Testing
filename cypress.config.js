const { defineConfig } = require("cypress");
const axios = require("axios");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // 1. Pass system environment variables into Cypress.env
            config.env.JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL;
            config.env.JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
            config.env.JIRA_BASE_URL = process.env.JIRA_BASE_URL;
            config.env.JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

            // 2. Register Node-space tasks
            on("task", {
                async jiraRequest({ method, url, headers, data }) {
                    try {
                        const response = await axios({
                            method,
                            url,
                            headers,
                            data,
                            validateStatus: () => true // Allow non-2xx status codes to return without throwing Node errors
                        });
                        return {
                            status: response.status,
                            body: response.data
                        };
                    } catch (error) {
                        throw new Error(`Node Proxy API Error: ${error.message}`);
                    }
                }
            });

            // 3. Return the modified config object at the very end
            return config;
        },
    }
});
