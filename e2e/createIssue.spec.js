import { test, expect } from "@playwright/test";

test("user can create a new issue", async ({ page }) => {
  // 1. Login
  await page.goto("/");

  await page
    .getByLabel("Email")
    .fill("test@example.com");

  await page
    .getByLabel("Password")
    .fill("Test1234!");

  await page
    .getByRole("button", {
      name: "Login",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(
    /\/admin$|\/projects$/,
  );

  // 2. Go to Issues page
  await page.goto("/issues");

  // Wait for the Issues page
  await expect(
    page.getByText("Issues", { exact: true })
  ).toBeVisible();

  // 3. New Issue button should become available
  const newIssueButton = page.getByRole("button", {
    name: "New Issue",
  });

  await expect(newIssueButton).toBeEnabled();

  await newIssueButton.click();

  // 4. Verify Create Issue dialog opened
  await expect(
    page.getByText("Create Issue", {
      exact: true,
    }).first()
  ).toBeVisible();

  // Unique title so repeated test runs don't conflict
  const issueTitle =
    `E2E Test Issue ${Date.now()}`;

  // 5. Fill required/basic information
  await page
    .getByLabel("Title")
    .fill(issueTitle);

  await page
    .getByLabel("Description")
    .fill("Created by Playwright E2E test");

  // Type already defaults to Issue
  // Priority already defaults to Medium
  // Story Points already defaults to 3
  // Assignee can remain empty

  // 6. Create the issue
  await page
    .getByRole("button", {
      name: "Create Issue",
      exact: true,
    })
    .click();

  // 7. Verify issue appears on page
  await expect(
    page.getByText(issueTitle, {
      exact: true,
    })
  ).toBeVisible();

  // 8. Verify issue type
  await expect(
    page.getByText("Issue", {
      exact: true,
    }).last()
  ).toBeVisible();
});