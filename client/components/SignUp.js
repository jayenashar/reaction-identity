import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import queryString from "query-string";
import SimpleSchema from "simpl-schema";
import useReactoForm from "reacto-form/cjs/useReactoForm";
import Random from "@reactioncommerce/random";
import Button from "@reactioncommerce/components/Button/v1";
import ErrorsBlock from "@reactioncommerce/components/ErrorsBlock/v1";
import Field from "@reactioncommerce/components/Field/v1";
import InlineAlert from "@reactioncommerce/components/InlineAlert/v1";
import TextInput from "@reactioncommerce/components/TextInput/v1";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";

/**
 *
 */
function callSignUp({ challenge, email, password }) {
  return new Promise((resolve, reject) => {
    Accounts.createUser({ email, password }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (!challenge) {
          resolve();
          return;
        }
        Meteor.call("oauth/login", { challenge }, (oauthLoginError, redirectUrl) => {
          if (oauthLoginError) {
            reject(oauthLoginError);
          } else {
            resolve(redirectUrl);
          }
        });
      }
    });
  });
}

const useStyles = makeStyles(() => ({
  inlineAlert: {
    marginBottom: 16
  },
  loginFormTitle: {
    color: "#1999dd",
    fontFamily: "'Source Sans Pro', 'Roboto', 'Helvetica Neue', Helvetica, sans-serif",
    fontSize: 30,
    fontWeight: 400,
    marginBottom: 40,
    textAlign: "center"
  }
}));

const formSchema = new SimpleSchema({
  email: {
    type: String,
    min: 3
  },
  password: {
    type: String,
    min: 6
  }
});
const validator = formSchema.getFormValidator();

/**
 *
 */
function SignUp() {
  const { t } = useTranslation(); // eslint-disable-line id-length
  const uniqueId = useMemo(() => Random.id(), []);
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { login_challenge: challenge } = queryString.parse(location.search);

  const {
    getErrors,
    getInputProps,
    submitForm
  } = useReactoForm({
    async onSubmit(formData) {
      setIsSubmitting(true);
      let redirectUrl;
      try {
        redirectUrl = await callSignUp({ challenge, ...formData });
      } catch (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
        return { ok: false };
      }
      setIsSubmitting(false);
      if (redirectUrl) window.location.href = redirectUrl;
      return { ok: true };
    },
    validator
  });

  return (
    <div>
      <div className={classes.loginFormTitle}>
        {t("createAccount")}
      </div>

      <Field isRequired errors={getErrors(["email"])} name="email" label={t("emailAddress")} labelFor={`email-${uniqueId}`}>
        <TextInput
          type="email"
          id={`email-${uniqueId}`}
          {...getInputProps("email")}
        />
        <ErrorsBlock errors={getErrors(["email"])} />
      </Field>
      <Field isRequired errors={getErrors(["password"])} name="password" label={t("password")} labelFor={`password-${uniqueId}`}>
        <TextInput
          type="password"
          id={`password-${uniqueId}`}
          {...getInputProps("password")}
        />
        <ErrorsBlock errors={getErrors(["password"])} />
      </Field>

      {submitError &&
        <InlineAlert
          alertType="error"
          className={classes.inlineAlert}
          message={submitError}
        />
      }

      <Button
        actionType="important"
        isFullWidth
        isWaiting={isSubmitting}
        onClick={submitForm}
      >
        {t("signUpButton")}
      </Button>
      <Button
        isDisabled={isSubmitting}
        isFullWidth
        isShortHeight
        isTextOnly
        onClick={() => { history.push({ pathname: "/account/login", search: location.search }); }}
      >
        {t("signIn")}
      </Button>
    </div>
  );
}

export default SignUp;
