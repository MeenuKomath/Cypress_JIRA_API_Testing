import { JiraClient } from '../support/utils/jiraClient';

describe('Jira Issue API - Isolated Operation Validation', () => {
  let jira;
  let createdIssueKey;
  let projectKey;
  let baselineSummary;
  let updatedSummary;

  before(() => {
    
      
      cy.env(['JIRA_PROJECT_KEY']).then(({ JIRA_PROJECT_KEY }) => {
      projectKey = JIRA_PROJECT_KEY;

      const localDateTime = new Date().toLocaleString();
      baselineSummary = `Cypress Automated Test - ${localDateTime}`;
      updatedSummary = `Cypress Automated Updated Test - ${localDateTime}`;
      
      // Initialize the client
      jira = new JiraClient();
    });
  });

  it('TC - 01: POST - Create Jira Issue', () => {
    jira.createIssue(projectKey, baselineSummary, 'Task').then((createRes) => {
      expect(createRes.status).to.eq(201);
      
      const createBody = createRes.body;
      createdIssueKey = createBody.key;

      expect(createBody).to.have.property('id');
      expect(createBody).to.have.property('key');
      expect(createBody).to.have.property('self');

      expect(createBody.id).to.be.a('string');
      expect(createBody.key).to.match(new RegExp(`^${projectKey}`));
      expect(createBody.self).to.include(`atlassian.net/rest/api/3/issue/${createBody.id}`);
      
      cy.log(`POST Issue generated successfully, Created issue ticket: ${createdIssueKey}`);
    });
  });

  it('TC - 02: GET - Read Issue State', function() {
    if (!createdIssueKey) {
      cy.log('Skipping GET test: Issue key context was not created.');
      this.skip();
    }

    jira.getIssue(createdIssueKey).then((response) => {
      expect(response.status).to.eq(200);
      
      const body = response.body;
      expect(body.fields.project.key).to.eq(projectKey);
      expect(body.fields.summary).to.eq(baselineSummary);
      expect(body.fields.status.name).to.eq('To Do');
      
      cy.log(`GET - Issue generated successfully, Name and Summary: ${body.fields.status.name} - ${body.fields.summary}`);
    });
  });

  it('TC - 03: PUT - Update Issue Fields', function() {
    if (!createdIssueKey) {
      cy.log('Skipping PUT test: Issue key context was not created.');
      this.skip();
    }

    jira.updateIssue(createdIssueKey, { summary: updatedSummary }).then((response) => {
      expect(response.status).to.eq(204);

      jira.getIssue(createdIssueKey).then((verifyRes) => {
        const verifyBody = verifyRes.body;
        expect(verifyBody.fields.summary).to.eq(updatedSummary);
        cy.log(`PUT - Issue updated successfully, New Summary: ${verifyBody.fields.summary}`);
      });
    });
  });

 it('TC - 04: DELETE - Delete Issue', function() {
    if (!createdIssueKey) {
      cy.log('Skipping DELETE test: Issue key context was not created.');
      cy.log('Skipping DELETE test: Issue key context was not created.');
      this.skip();
    }

    jira.deleteIssue(createdIssueKey).then((deleteRes) => {
      expect(deleteRes.status).to.eq(204);

      jira.getIssue(createdIssueKey, { failOnStatusCode: false }).then((postDeleteCheck) => {
        expect(postDeleteCheck.status).to.eq(404);
        cy.log(`DELETE - Issue deleted successfully`);
      });
    });
  });
});
