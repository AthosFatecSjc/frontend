<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card width="700" class="pa-6 elevation-4">

      <!-- Header -->
      <div class="text-center mb-6">
        <v-img src="/logo.png" contain />
        <h2 class="mt-2">HiATHOS / Tecsys</h2>
        <h1 class="text-h5 font-weight-bold mt-4">
          Request access to the platform
        </h1>
        <p class="text-body-2 mt-2">
          Fill in your data to request access. Your registration will be reviewed by an administrator.
        </p>
      </div>

      <!-- Form -->
      <v-form ref="formRef" v-model="isFormValid">
        
        <v-text-field
          v-model="form.name"
          label="Full Name"
          :rules="[rules.required]"
          required
        />

        <v-text-field
          v-model="form.email"
          label="E-mail"
          :rules="[rules.required, rules.email]"
          required
        />

        <v-text-field
          v-model="form.password"
          label="Password"
          type="password"
          :rules="[rules.required, rules.passwordStrength]"
          required
        />

        <v-text-field
          v-model="form.confirmPassword"
          label="Confirm Password"
          type="password"
          :rules="[rules.required, rules.passwordMatch]"
          required
        />

        <v-text-field
          v-model="form.phone"
          label="Phone (optional)"
        />

        <!-- Terms Block -->
        <div>
          <v-checkbox
            v-model="form.acceptTerms"
            :rules="[rules.mustAcceptTerms]"
            required
          >
            <template #label>
              I have read and accept the
              <a href="#" @click.prevent="openTerms">Terms of Use</a>
            </template>
          </v-checkbox>

          <v-checkbox
            v-model="form.acceptPrivacy"
            :rules="[rules.mustAcceptPrivacy]"
            required
          >
            <template #label>
              I acknowledge the
              <a href="#" @click.prevent="openPrivacy">Privacy Notice</a>
            </template>
          </v-checkbox>

          <v-checkbox
            v-model="form.acceptMarketing"
          >
            <template #label >
              I agree to receive communications and updates by email
            </template>
          </v-checkbox>

        </div>

        <!-- Feedback -->
        <v-alert
          v-if="errorMessage"
          type="error"
          class="mt-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
          v-if="success"
          type="success"
          class="mt-4"
        >
          Registration successful. Your request is under review.
        </v-alert>

        <!-- Actions -->
        <v-btn
          color="primary"
          block
          :loading="loading"
          @click="submit"
        >
          Request access
        </v-btn>

        <v-btn
          class="mt-2"
          variant="text"
          block
          @click="goToLogin"
        >
          I already have an account
        </v-btn>

      </v-form>

      <!-- Footer -->
      <p class="text-caption text-center mt-4">
        After registration, your account will remain pending until administrative approval.
      </p>

    </v-card>

    <!-- Terms Dialog -->
    <v-dialog v-model="showTerms" max-width="700">
      <v-card>
        <v-card-title>Terms of Use</v-card-title>
        <v-card-text>
          <!-- Replace with real content -->
          Terms content here...
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showTerms = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Privacy Dialog -->
    <v-dialog v-model="showPrivacy" max-width="700">
      <v-card>
        <v-card-title>Privacy Notice</v-card-title>
        <v-card-text>
          <!-- Replace with real content -->
          Privacy content here...
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showPrivacy = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// Form state
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  acceptTerms: false,
  acceptPrivacy: false,
  acceptMarketing: false
})

// UI state
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')
const isFormValid = ref(false)
const formRef = ref()

// Dialogs
const showTerms = ref(false)
const showPrivacy = ref(false)

// Validation rules
const rules = {
  required: (v: string) => !!v || 'This field is required',
  email: (v: string) =>
    /.+@.+\..+/.test(v) || 'Invalid e-mail',
  passwordStrength: (v: string) =>
    v.length >= 6 || 'Weak password (min 6 characters)',
  passwordMatch: () =>
    form.password === form.confirmPassword || 'Passwords do not match',
  mustAcceptTerms: (v: boolean) =>
    v || 'You must accept the Terms of Use',
  mustAcceptPrivacy: (v: boolean) =>
    v || 'You must acknowledge the Privacy Notice'
}

// Actions
const openTerms = () => (showTerms.value = true)
const openPrivacy = () => (showPrivacy.value = true)

const goToLogin = () => {
  router.push('/login')
}

// Submit
const submit = async () => {
  errorMessage.value = ''

  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    await axios.post('/api/signup', {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      marketingConsent: form.acceptMarketing
    })

    success.value = true

  } catch (err: any) {
    if (err.response?.status === 409) {
      errorMessage.value = 'This e-mail is already registered.'
    } else {
      errorMessage.value = 'Error while submitting registration.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
a {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
}
</style>