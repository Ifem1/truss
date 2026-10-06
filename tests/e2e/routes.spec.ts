import { expect,test } from "@playwright/test";
test("landing explains release lineage",async({page})=>{await page.goto("/");await expect(page.getByText("Software changes.")).toBeVisible();await expect(page.getByRole("link",{name:/create admission policy/i})).toBeVisible()});
test("policy form is reachable",async({page})=>{await page.goto("/policy/new");await expect(page.getByRole("heading",{name:/Define what a release must prove/i})).toBeVisible()});
test("release form asks for exact commit",async({page})=>{await page.goto("/release/new");await expect(page.getByText("Exact commit SHA")).toBeVisible()});
