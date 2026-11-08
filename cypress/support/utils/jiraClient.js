export class JiraClient {
  constructor() {
    this.baseUrl = '';
    this.authHeader = '';
  }

  /**
   * Internal lazy initializer ensuring credentials resolve safely using Cypress 16 cy.env() object syntax
   */
  _initialize() {
    return cy.env(['JIRA_BASE_URL', 'JIRA_USER_EMAIL', 'JIRA_API_TOKEN']).then(({ JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN }) => {
      if (!JIRA_BASE_URL || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
        throw new Error('JiraClient Error: Missing required JIRA_BASE_URL, JIRA_USER_EMAIL, or JIRA_API_TOKEN environment configurations.');
      }
      this.baseUrl = `https://${JIRA_BASE_URL}.atlassian.net/rest/api/3`;
      const credentials = btoa(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`);
      this.authHeader = `Basic ${credentials}`;
    });
  }

  _logRequest(name, method, url, body) {
    return Cypress.log({
      name: name,
      displayName: `JIRA : ${method}`,
      message: url.replace(this.baseUrl, ''),
      consoleProps: () => ({
        URL: url,
        Payload: body || 'No Payload'
      })
    });
  }

  createIssue(projectKey, summary, issueType = 'Task') {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue`;
      const body = { fields: { project: { key: projectKey }, summary, issuetype: { name: issueType } } };
      const logger = this._logRequest('Create Issue', 'POST', url, body);

      // Route via server-side Node task to completely isolate from browser XSRF checks
      return cy.task('jiraRequest', {
        method: 'POST',
        url,
        headers: { 
          'Authorization': this.authHeader, 
          'Content-Type': 'application/json'
        },
        data: body
      }).then((response) => {
        logger.set({ message: `${url.replace(this.baseUrl, '')} | Status: ${response.status}` });
        return response;
      });
    });
  }

  getIssue(issueKey, options = {}) {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue/${issueKey}`;
      const logger = this._logRequest('Get Issue', 'GET', url);

      return cy.task('jiraRequest', {
        method: 'GET',
        url,
        headers: { 
          'Authorization': this.authHeader, 
          'Accept': 'application/json' 
        }
      }).then((response) => {
        logger.set({ message: `${issueKey} | Status: ${response.status}` });
        return response;
      });
    });
  }

  updateIssue(issueKey, fields) {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue/${issueKey}`;
      const body = { fields };
      const logger = this._logRequest('Update Issue', 'PUT', url, body);

      return cy.task('jiraRequest', {
        method: 'PUT',
        url,
        headers: { 
          'Authorization': this.authHeader, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: body
      }).then((response) => {
        logger.set({ message: `${issueKey} | Status: ${response.status}` });
        return response;
      });
    });
  }

  getTransitions(issueKey) {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue/${issueKey}/transitions`;
      const logger = this._logRequest('Get Transitions', 'GET', url);

      return cy.task('jiraRequest', {
        method: 'GET',
        url,
        headers: { 
          'Authorization': this.authHeader, 
          'Accept': 'application/json' 
        }
      }).then((response) => {
        logger.set({ message: `${issueKey} | Status: ${response.status}` });
        return response;
      });
    });
  }

  transitionIssue(issueKey, transitionId) {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue/${issueKey}/transitions`;
      const body = { transition: { id: transitionId } };
      const logger = this._logRequest('Transition Issue', 'POST', url, body);

      return cy.task('jiraRequest', {
        method: 'POST',
        url,
        headers: { 
          'Authorization': this.authHeader, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: body
      }).then((response) => {
        logger.set({ message: `${issueKey} -> ID: ${transitionId} | Status: ${response.status}` });
        return response;
      });
    });
  }

  deleteIssue(issueKey) {
    return this._initialize().then(() => {
      const url = `${this.baseUrl}/issue/${issueKey}`;
      const logger = this._logRequest('Delete Issue', 'DELETE', url);

      return cy.task('jiraRequest', {
        method: 'DELETE',
        url,
        headers: { 'Authorization': this.authHeader }
      }).then((response) => {
        logger.set({ message: `${issueKey} | Status: ${response.status}` });
        return response;
      });
    });
  }
}
