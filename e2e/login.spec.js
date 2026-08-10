import { test, expect } from "@playwright/test";

test("user can login successfully", async ({ page }) => {
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

  // Admin or lead -> /admin
  // Member -> /projects
  await expect(page).toHaveURL(
    /\/admin$|\/projects$/,
  );

  const storedUser = await page.evaluate(() => {
    return localStorage.getItem("user");
  });

  expect(storedUser).not.toBeNull();
});